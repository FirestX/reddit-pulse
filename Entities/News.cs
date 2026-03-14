namespace project.Entities;

public class News
{
    public string Id { get; set; }
    public string Title { get; set; }
    public string Author { get; set; }
    public int Upvotes { get; set; }
    public string? ImageUrl { get; set; }
    public string Subreddit { get; set; }

    public News(string id, string title, string author, int upvotes, string? imageUrl, string subreddit)
    {
        Id = id;
        Title = title;
        Author = author;
        Upvotes = upvotes;
        ImageUrl = imageUrl;
        Subreddit = subreddit;
    }

    
}

