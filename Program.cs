using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using project.Entities;

namespace project;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        // Add services to the container.
        builder.Services.AddAuthorization();


        var app = builder.Build();

        // Configure the HTTP request pipeline.

        app.UseAuthorization();

        Dictionary<string,string[]> Groups = new Dictionary<string, string[]>();
        Groups.Add("funny", ["funny", "funnyvideos", "Funnymemes", "meme", "memes"]); // funny / memes category
        Groups.Add("news", ["law", "politics", "news", "worldnews", "UnderReportedNews"]); // political news / generical news
        Groups.Add("gamning", ["gaming", "pcgaming", "gamingnews", "games", "GamingLeaksAndRumours"]); // gaming
        Groups.Add("linux", ["unixporn", "linux"]); // linux
        Groups.Add("technology", ["technology", "technews", "tech"]); // technology

        app.MapGet("/api/group/{subGroup}", async (HttpContext httpContext, [FromRoute] string subGroup) =>
        {
            if (!Groups.ContainsKey(subGroup))
            {
                return Results.NotFound();
            }

            var subList = Groups[subGroup];
            using var http = new HttpClient();
            // Reddit requires a User-Agent
            http.DefaultRequestHeaders.UserAgent.ParseAdd("RedditPulseApp/1.0");

            List<News> newsList = new List<News>();
            foreach (var sub in subList)
            {
                var resp = await http.GetAsync($"https://www.reddit.com/r/{sub}/hot.json");
                resp.EnsureSuccessStatusCode();
                await using var stream = await resp.Content.ReadAsStreamAsync();

                using var doc = await JsonDocument.ParseAsync(stream);
                newsList.AddRange(JsonNewsParse(doc));
            }

            // return JSON array of objects { title, author }
            return Results.Json(newsList);
        });

        app.MapGet("/api/trends", async (HttpContext httpContext) =>
        {
            using var http = new HttpClient();
            // Reddit requires a User-Agent
            http.DefaultRequestHeaders.UserAgent.ParseAdd("RedditPulseApp/1.0");

            var resp = await http.GetAsync("https://www.reddit.com/.json");
            resp.EnsureSuccessStatusCode();
            await using var stream = await resp.Content.ReadAsStreamAsync();

            using var doc = await JsonDocument.ParseAsync(stream);
            var newsList = JsonNewsParse(doc);

            // return JSON array of objects { title, author }
            return Results.Json(newsList);
        });

        app.MapGet("/api/trends/{subreddit}", async (HttpContext httpContext, [FromRoute] string subreddit) =>
        {
            using var http = new HttpClient();
            // Reddit requires a User-Agent
            http.DefaultRequestHeaders.UserAgent.ParseAdd("RedditPulseApp/1.0");

            var resp = await http.GetAsync($"https://www.reddit.com/r/{subreddit}/hot.json");
            resp.EnsureSuccessStatusCode();
            await using var stream = await resp.Content.ReadAsStreamAsync();

            using var doc = await JsonDocument.ParseAsync(stream);
            var newsList = JsonNewsParse(doc);

            // return JSON array of objects { title, author }
            return Results.Json(newsList);
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
                    var titolo = postData.GetProperty("title").GetString() ?? "";
                    var autore = postData.GetProperty("author").GetString() ?? "";
                    var numeroUpvote = postData.GetProperty("ups").GetInt32();
                    var urlImmagine = postData.GetProperty("thumbnail").GetString();
                    var subreddit = postData.GetProperty("subreddit_name_prefixed").GetString() ?? "";
                    News news = new News(id, titolo, autore, numeroUpvote, urlImmagine, subreddit);
                    newsList.Add(news);
                }
            }
        }
        return newsList;
    }
}

