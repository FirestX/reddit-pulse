using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using project.Entities;

namespace project;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        var app = builder.Build();

        Dictionary<string,string[]> Groups = new()
        {
            { "funny", ["funny", "funnyvideos", "Funnymemes", "meme", "memes"] }, // funny / memes category
            { "news", ["law", "politics", "news", "worldnews", "UnderReportedNews"] }, // political news / generical news
            { "gamning", ["gaming", "pcgaming", "gamingnews", "games", "GamingLeaksAndRumours"] }, // gaming
            { "linux", ["unixporn", "linux"] }, // linux
            { "technology", ["technology", "technews", "tech"] } // technology
        };

        var httpClient = new HttpClient();
        httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("RedditPulseApp/1.0");

        app.MapGet("/api/group/{subGroup}", async (HttpContext httpContext, [FromRoute] string subGroup) =>
        {
            if (!Groups.ContainsKey(subGroup))
                return Results.NotFound();

            var subList = Groups[subGroup];

            List<News> newsList = [];
            foreach (var sub in subList)
            {
                var response = await httpClient.GetAsync($"https://www.reddit.com/r/{sub}/hot.json");
                response.EnsureSuccessStatusCode();
                await using var stream = await response.Content.ReadAsStreamAsync();

                using var doc = await JsonDocument.ParseAsync(stream);
                newsList.AddRange(JsonNewsParse(doc));
            }

            return Results.Ok(newsList);
        });

        app.MapGet("/api/trends", async (HttpContext httpContext) =>
        {
            var response = await httpClient.GetAsync("https://www.reddit.com/.json");
            response.EnsureSuccessStatusCode();
            await using var stream = await response.Content.ReadAsStreamAsync();

            using var doc = await JsonDocument.ParseAsync(stream);
            var newsList = JsonNewsParse(doc);

            return Results.Ok(newsList);
        });

        app.MapGet("/api/trends/{subreddit}", async (HttpContext httpContext, [FromRoute] string subreddit) =>
        {
            var response = await httpClient.GetAsync($"https://www.reddit.com/r/{subreddit}/hot.json");
            response.EnsureSuccessStatusCode();
            await using var stream = await response.Content.ReadAsStreamAsync();

            using var doc = await JsonDocument.ParseAsync(stream);
            var newsList = JsonNewsParse(doc);

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

