using System;
using Calendar.Domain;

namespace Calendar.Application;

public class ItemFabric
{
    private int TaskCreated = 0;
    public ItemFabric()
    {
    }

    public TaskItem CreateNewTask(string name, string description, DateTime deadline, int goal, string color)
    {
        TaskItem res = new TaskItem(name, description, deadline, goal, color);
        TaskCreated++;
        
        return res;
    }
}