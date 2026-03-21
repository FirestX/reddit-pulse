using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using project.Entities;

namespace project;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);
        
        builder.Services.AddMemoryCache();
        builder.Services.AddHttpClient("RedditClient", client =>
        {
            client.DefaultRequestHeaders.UserAgent.ParseAdd("RedditPulseApp/1.0");
        });
        
        builder.Services.AddCors(options =>
        {
            options.AddPolicy("AllowAll", policy =>
            {
                policy.AllowAnyOrigin()
                      .AllowAnyMethod()
                      .AllowAnyHeader();
            });
        });

        var app = builder.Build();
        
        app.UseCors("AllowAll");

        Dictionary<string,string[]> Groups = new()
        {
            { "funny", ["funny", "funnyvideos", "Funnymemes", "meme", "memes"] }, // funny / memes category
            { "news", ["law", "politics", "news", "worldnews", "UnderReportedNews"] }, // political news / generical news
            { "gaming", ["gaming", "pcgaming", "gamingnews", "games", "GamingLeaksAndRumours"] }, // gaming
            { "linux", ["unixporn", "linux"] }, // linux
            { "technology", ["technology", "technews", "tech"] } // technology
        };

        app.MapGet("/api/group/{subGroup}", async (IHttpClientFactory httpClientFactory, IMemoryCache cache, [FromRoute] string subGroup) =>
        {
            if (!Groups.ContainsKey(subGroup))
                return Results.NotFound();

            if (cache.TryGetValue($"group_{subGroup}", out List<News>? cachedNews))
                return Results.Ok(cachedNews);

            var subList = Groups[subGroup];
            var httpClient = httpClientFactory.CreateClient("RedditClient");

            List<News> newsList = [];
            foreach (var sub in subList)
            {
                var response = await httpClient.GetAsync($"https://www.reddit.com/r/{sub}/hot.json");
                response.EnsureSuccessStatusCode();
                await using var stream = await response.Content.ReadAsStreamAsync();

                using var doc = await JsonDocument.ParseAsync(stream);
                newsList.AddRange(JsonNewsParse(doc));
            }

            cache.Set($"group_{subGroup}", newsList, TimeSpan.FromMinutes(5));
            return Results.Ok(newsList);
        });

        app.MapGet("/api/trends", async (IHttpClientFactory httpClientFactory, IMemoryCache cache) =>
        {
            if (cache.TryGetValue("trends", out List<News>? cachedNews))
                return Results.Ok(cachedNews);

            var httpClient = httpClientFactory.CreateClient("RedditClient");
            var response = await httpClient.GetAsync("https://www.reddit.com/.json");
            response.EnsureSuccessStatusCode();
            await using var stream = await response.Content.ReadAsStreamAsync();

            using var doc = await JsonDocument.ParseAsync(stream);
            var newsList = JsonNewsParse(doc);

            cache.Set("trends", newsList, TimeSpan.FromMinutes(5));
            return Results.Ok(newsList);
        });

        app.MapGet("/api/trends/{subreddit}", async (IHttpClientFactory httpClientFactory, IMemoryCache cache, [FromRoute] string subreddit) =>
        {
            if (cache.TryGetValue($"trends_{subreddit}", out List<News>? cachedNews))
                return Results.Ok(cachedNews);

            var httpClient = httpClientFactory.CreateClient("RedditClient");
            var response = await httpClient.GetAsync($"https://www.reddit.com/r/{subreddit}/hot.json");
            response.EnsureSuccessStatusCode();
            await using var stream = await response.Content.ReadAsStreamAsync();

            using var doc = await JsonDocument.ParseAsync(stream);
            var newsList = JsonNewsParse(doc);

            cache.Set($"trends_{subreddit}", newsList, TimeSpan.FromMinutes(5));
            return Results.Ok(newsList);
        });

        app.Run();
    }

    static List<News> JsonNewsParse(JsonDocument doc)
    {
        var newsList = new List<News>();
        if (doc.RootElement.TryGetProperty("data", out var rootData) &&
            rootData.TryGetProperty("children", out var children) &&
            children.ValueKind == JsonValueKind.Array)
        {
            foreach (var child in children.EnumerateArray())
            {
                if (child.TryGetProperty("data", out var postData))
                {
                    var id = postData.GetProperty("id").GetString() ?? "";
                    var title = postData.GetProperty("title").GetString() ?? "";
                    var author = postData.GetProperty("author").GetString() ?? "";
                    var upvotes = postData.GetProperty("ups").GetInt32();
                    var imageUrl = postData.GetProperty("thumbnail").GetString();
                    var subreddit = postData.GetProperty("subreddit_name_prefixed").GetString() ?? "";
                    News news = new(id, title, author, upvotes, imageUrl, subreddit);
                    newsList.Add(news);
                }
            }
        }
        return newsList;
    }
}



