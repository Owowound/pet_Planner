namespace Analytics.Application.EndpointHandlers.Commands;

public record GetGeneralStatsCommand(DateTime? From, DateTime? To);
