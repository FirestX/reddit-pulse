using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using project.Entities;

namespace project.Services;

public interface IRedditService
{
    Task<List<News>> GetTrendsAsync();
    Task<List<News>> GetSubredditAsync(string subreddit);
    Task<List<News>> GetGroupAsync(string groupName);
}

public class RedditService(IHttpClientFactory httpClientFactory, IMemoryCache cache) : IRedditService
{
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(5);
    private static readonly string[] ImageExtensions = [".jpg", ".jpeg", ".png", ".gif"];
    
    private static readonly Dictionary<string, string[]> Groups = new()
    {
        ["funny"] = ["funny", "funnyvideos", "Funnymemes", "meme", "memes"],
        ["news"] = ["law", "politics", "news", "worldnews", "UnderReportedNews"],
        ["gaming"] = ["gaming", "pcgaming", "gamingnews", "games", "GamingLeaksAndRumours"],
        ["linux"] = ["unixporn", "linux"],
        ["technology"] = ["technology", "technews", "tech"]
    };

    public async Task<List<News>> GetTrendsAsync() =>
        await GetCachedAsync("trends", "https://www.reddit.com/.json");

    public async Task<List<News>> GetSubredditAsync(string subreddit) =>
        await GetCachedAsync($"subreddit_{subreddit}", $"https://www.reddit.com/r/{subreddit}/hot.json");

    public async Task<List<News>> GetGroupAsync(string groupName)
    {
        if (!Groups.TryGetValue(groupName, out var subreddits))
            return [];

        var cacheKey = $"group_{groupName}";
        if (cache.TryGetValue(cacheKey, out List<News>? cached))
            return cached!;

        var tasks = subreddits.Select(sub => FetchFromRedditAsync($"https://www.reddit.com/r/{sub}/hot.json"));
        var results = await Task.WhenAll(tasks);
        var news = results.SelectMany(x => x).ToList();

        cache.Set(cacheKey, news, CacheDuration);
        return news;
    }

    public static bool IsValidGroup(string groupName) => Groups.ContainsKey(groupName);

    private async Task<List<News>> GetCachedAsync(string cacheKey, string url)
    {
        if (cache.TryGetValue(cacheKey, out List<News>? cached))
            return cached!;

        var news = await FetchFromRedditAsync(url);
        cache.Set(cacheKey, news, CacheDuration);
        return news;
    }

    private async Task<List<News>> FetchFromRedditAsync(string url)
    {
        var client = httpClientFactory.CreateClient("RedditClient");
        var response = await client.GetAsync(url);
        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync();
        using var doc = await JsonDocument.ParseAsync(stream);
        
        return ParseRedditResponse(doc);
    }

    private static List<News> ParseRedditResponse(JsonDocument doc)
    {
        if (!doc.RootElement.TryGetProperty("data", out var data) ||
            !data.TryGetProperty("children", out var children) ||
            children.ValueKind != JsonValueKind.Array)
            return [];

        return children.EnumerateArray()
            .Where(child => child.TryGetProperty("data", out _))
            .Select(child => ParsePost(child.GetProperty("data")))
            .ToList();
    }

    private static News ParsePost(JsonElement post)
    {
        return new News(
            Id: post.GetProperty("id").GetString() ?? "",
            Title: post.GetProperty("title").GetString() ?? "",
            Author: post.GetProperty("author").GetString() ?? "",
            Upvotes: post.GetProperty("ups").GetInt32(),
            ImageUrl: ExtractImageUrl(post),
            Subreddit: post.GetProperty("subreddit_name_prefixed").GetString() ?? ""
        );
    }

    private static string? ExtractImageUrl(JsonElement post)
    {
        // Try preview image (high quality)
        if (post.TryGetProperty("preview", out var preview) &&
            preview.TryGetProperty("images", out var images) &&
            images.GetArrayLength() > 0 &&
            images[0].TryGetProperty("source", out var source) &&
            source.TryGetProperty("url", out var previewUrl))
        {
            return previewUrl.GetString()?.Replace("&amp;", "&");
        }

        // Try direct image URL
        if (post.TryGetProperty("url", out var urlProp))
        {
            var url = urlProp.GetString();
            if (!string.IsNullOrEmpty(url) && ImageExtensions.Any(ext => url.EndsWith(ext, StringComparison.OrdinalIgnoreCase)))
                return url;
        }

        // Fallback to thumbnail
        return post.TryGetProperty("thumbnail", out var thumb) ? thumb.GetString() : null;
    }
}
