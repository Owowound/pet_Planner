using System;
using Calendar.Domain;

namespace Calendar.Application;

public class TagFabric
{
    private int TagCreated = 0;
    public TagFabric()
    {
    }

    public Tag CreateNewTag(string name, string color)
    {
        Tag res = new Tag(name, color);
        TagCreated++;
        
        return res;
    }
}