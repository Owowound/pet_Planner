namespace Analytics.Application.EndpointHandlers.Commands;

public record GetProgressStatisticsCommand(DateTime? From, DateTime? To);
