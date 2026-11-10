using System;
using Calendar.Domain;

namespace Calendar.Application.Handlers.Commands;

public record AddSubTaskCommand
(
    Guid ParentId,
    Guid ChildId
);