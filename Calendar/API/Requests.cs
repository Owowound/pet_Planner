using System;
using Calendar.Domain;

namespace Calendar.Api.Endpoints;

public record CreateTaskRequest(string Name, string? Description, DateTime Deadline, int Goal, List<Guid> Tags, string color);
public record EditTaskRequest(string Name, string? Description, DateTime Deadline, int Goal, List<Guid> Tags, string color);

public record UpdateTaskRequest(string Name, string? Description, DateTime Deadline, int Goal);

public record AddProgressRequest(int AdditionalProgress);

public record AddSubTaskRequest(Guid ChildId);

public record CreatedResponse(Guid Id);

public record CreateTagRequest(string Name, string color);
public record EditTagRequest(string Name, string color);