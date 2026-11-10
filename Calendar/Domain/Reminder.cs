namespace Calendar.Domain;

public class Reminder
{
    public Guid Id { get; set; }
    public string Text { get; set; }
    public DateTime RemindAt { get; set; }
    public DateTime CreatedAt { get; set; }

    public Reminder(string text, DateTime remindAt)
    {
        Id = Guid.NewGuid();
        Text = text;
        RemindAt = remindAt;
        CreatedAt = DateTime.Now;
    }
}