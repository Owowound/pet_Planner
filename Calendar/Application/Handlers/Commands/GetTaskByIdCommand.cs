using System;

namespace Calendar.Application.Handlers.Commands;

public record GetTaskByIdCommand(Guid Id);