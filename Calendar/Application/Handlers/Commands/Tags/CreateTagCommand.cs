using System;

namespace Calendar.Application.Handlers.Commands;

public record CreateTagCommand( string name, string color );