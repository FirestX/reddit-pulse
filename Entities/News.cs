namespace project.Entities;

public class News
{
    public string Id { get; set; }
    public string Titolo { get; set; }
    public string Autore { get; set; }
    public int NumeroUpvote { get; set; }
    public string? UrlImmagine { get; set; }
    public string Subreddit { get; set; }

    public News(string id, string titolo, string autore, int numeroUpvote, string? urlImmagine, string subreddit)
    {
        Id = id;
        Titolo = titolo;
        Autore = autore;
        NumeroUpvote = numeroUpvote;
        UrlImmagine = urlImmagine;
        Subreddit = subreddit;
    }

    
}

