using project.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddMemoryCache();
builder.Services.AddHttpClient("RedditClient", client =>
    client.DefaultRequestHeaders.UserAgent.ParseAdd("RedditPulseApp/1.0"));
builder.Services.AddScoped<IRedditService, RedditService>();
builder.Services.AddCors(options =>
    options.AddPolicy("AllowAll", policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

var app = builder.Build();
app.UseCors("AllowAll");

app.MapGet("/api/trends", async (IRedditService reddit) =>
    Results.Ok(await reddit.GetTrendsAsync()));

app.MapGet("/api/trends/{subreddit}", async (IRedditService reddit, string subreddit) =>
    Results.Ok(await reddit.GetSubredditAsync(subreddit)));

app.MapGet("/api/group/{groupName}", async (IRedditService reddit, string groupName) =>
    RedditService.IsValidGroup(groupName)
        ? Results.Ok(await reddit.GetGroupAsync(groupName))
        : Results.NotFound());

app.Run();
