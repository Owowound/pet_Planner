using System;

namespace Calendar.Application.Handlers.Commands;

public record GetTasksByPeriodCommand(DateTime DateStart, DateTime DateEnd);