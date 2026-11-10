using System;
using Calendar.Domain;

namespace Calendar.Application.Handlers.Commands;

public record AddProgressCommand( 
    Guid Id,
    int AdditionalProgress
);