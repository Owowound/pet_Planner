using System;
using System.Collections.Generic;
using System.Linq;
using Calendar.Domain.Color;
using Calendar.Domain.Exceptions;

namespace Calendar.Domain;

public class TaskItem
{
    public Guid Id { get; set; }
    public string Name { get; protected set; }
    public string Description { get; protected set; }
    private string color;
    public string Color
    {
        get => color; 
        private set  => color = ColorRules.Normalize(value);
    }
    public DateTime CreatedAt { get; protected set; }
    public DateTime UpdatedAt { get; private set; }
    public DateTime Deadline { get; private set; }
    public int Goal { get; private set; }
    public int Progress { get; private set; }

    public Guid? ParentId { get; private set; }
    public TaskItem? Parent { get; private set; }

    public List<Tag> Tags { get; private set; } = new();

    public List<TaskItem?> subTasks { get; private set; } = new();

    public double ProgressPercent => (float)Progress  / (float)Goal * 100;

    public double ChildProgressPercent => GetChildProgressPercent();
    
    public bool IsCompleted => subTasks.Count > 0
        ? ChildProgressPercent >= 100
        : ProgressPercent >= 100;
    
    private TaskItem() { }
    
    public TaskItem(string name, string description, DateTime deadline, int goal, string color)
    {
        Color = color;
        Id = Guid.NewGuid();
        Name = name;
        Description = description;
        Deadline = deadline;
        Goal = goal;
        Progress = 0;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetTags(List<Tag> newTags)
    {
        var target = newTags;
        Tags.RemoveAll(t => target.All(n => n.TagId != t.TagId));
        foreach (var tag in target.Where(n => Tags.All(t => t.TagId != n.TagId)))
        {
            Tags.Add(tag);
        }
        UpdatedAt = DateTime.UtcNow;
    }
    
    public bool AddProgress(int additionalProgress)
    {
        Progress = Math.Clamp(Progress + additionalProgress, 0, Goal);
        UpdatedAt = DateTime.UtcNow;
        if (Progress >= Goal)
        {
            Complete();
            return true;
        }

        return false;
    }

    public void EditTask(string newName, string newDescription, DateTime newDeadline, int newGoal, string newColor)
    {
        Color = newColor;
        Name = newName;
        Description = newDescription;
        Deadline = newDeadline;
        Goal = newGoal;
        Progress = Math.Clamp(Progress, 0, Goal);
        UpdatedAt = DateTime.UtcNow;
    }

    public void AddSubTask(TaskItem subTask)
    {
        if (subTask.Id == this.Id)
        {
            throw new DomainException("Задача не может быть своей поддзадачей");
        }

        if (subTask.ParentId != null)
        {
            throw new DomainException("Подзадача уже назначена другой задаче");
        }
        subTasks.Add(subTask);
        subTask.Parent = this;
        subTask.ParentId = Id;
        UpdatedAt = DateTime.UtcNow;
        subTask.UpdatedAt = DateTime.UtcNow;
    }

    public void Complete()
    {
        Progress = Goal;
        UpdatedAt = DateTime.UtcNow;
    }

    public double GetChildProgressPercent()
    {
        double ProgressSumm = 0;

        foreach (var subTask in subTasks)
        {
            ProgressSumm += subTask.GetChildProgressPercent();
        }

        if (subTasks.Count > 0)
        {
            return ProgressSumm / subTasks.Count;
        }
        else
        {
            return ProgressPercent;
        }
    }
    
}