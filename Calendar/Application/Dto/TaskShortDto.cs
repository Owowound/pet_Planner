using System;
using System.Collections.Generic;
using Calendar.Domain;

namespace Calendar.Application.Dto;

public record TaskShortDto(
    Guid Id,
    string Name,
    DateTime Deadline,
    int Goal,
    int Progress,
    double ProgressPercent,
    bool IsCompleted,
    Guid? ParentId,
    List<Guid> Children,
    List<TagDto> Tags,
    string Color);
    
public record TaskDetailsDto(
    Guid Id, string Name, string Description, DateTime Deadline,
    int Goal, int Progress, double ProgressPercent, double ChildProgressPercent,
    bool IsCompleted, Guid? ParentId, List<SubTaskDto> SubTasks, List<TagDto> Tags, string Color);

public record SubTaskDto(
    Guid Id, 
    string Name, 
    DateTime Deadline, 
    double ProgressPercent, 
    bool IsCompleted,
    List<SubTaskDto> SubTasks, 
    string Color);

public record TagDto(Guid Id, string Name, string Color);
