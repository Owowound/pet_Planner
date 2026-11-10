using System;
using Calendar.Domain;

namespace Calendar.Application.Handlers.Commands;

public record CreateTaskCommand
(
    string Name,
    string Description,
    DateTime Deadline,
    int Goal,
    List<Guid> Tags,
    string color
);