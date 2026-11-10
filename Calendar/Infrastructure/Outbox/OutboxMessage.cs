using System;
using System.Text.Json;
using Contracts;

namespace Calendar.Infrastructure.Outbox;

public class OutboxMessage
{
    public Guid Id { get; private set; }
    public string Type { get; private set; } = null!;
    public string Payload { get; private set; } = null!;
    public DateTime OccurredAt { get; private set; }
    public DateTime? ProcessedAt { get; private set; }
    public string? Error { get; private set; }

    private OutboxMessage() { }

    public static OutboxMessage Create(IntegrationEvent evt) => new()
    {
        Id = evt.EventId,
        Type = evt.GetType().Name,
        Payload = JsonSerializer.Serialize(evt),
        OccurredAt = evt.OccurredAt,
    };

    public void MarkProcessed() { ProcessedAt = DateTime.UtcNow; Error = null; }
    public void MarkFailed(string error) => Error = error;
}