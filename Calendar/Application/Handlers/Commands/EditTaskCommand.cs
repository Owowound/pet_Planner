using Calendar.Domain;

namespace Calendar.Application.Handlers.Commands;

public record EditTaskCommand
(
    Guid TaskId,
    string NewName,
    string NewDescription,
    DateTime NewDeadline,
    int NewGoal,
    List<Guid> Tags,
    string NewColor
);