using System;
using Calendar.Domain.Color;

namespace Calendar.Domain;

public class Tag
{
    public Guid TagId { get; set; }
    public string TagName { get; set; }

    private string color;
    public string Color
    {
        get => color; 
        private set  => color = ColorRules.Normalize(value);
    }

    private Tag() { }
    
    public Tag(string name, string color)
    {
        this.color = color;
        TagId = Guid.NewGuid();
        TagName = name;
    }

    public void EditTag(string newName, string newColor)
    {
        color = newColor;
        TagName = newName;
    }
    
    public static string NormalizeTagName(string tagName) => tagName.Trim().ToLowerInvariant(); 
    
    
}