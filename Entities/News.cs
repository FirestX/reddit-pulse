namespace project.Entities;

public record News(
    string Id,
    string Title,
    string Author,
    int Upvotes,
    string? ImageUrl,
    string Subreddit
);
