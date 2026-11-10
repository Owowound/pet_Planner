using System;

namespace Calendar.Application.Handlers.Commands;

public record EditTagCommand( Guid TagId,  string name, string color);