using Analytics.Application.Dto;
using Analytics.Application.EndpointHandlers;
using Analytics.Application.EndpointHandlers.Commands;

namespace Analytics.API;

public static class AnalyticsEndpoints
{
    public static IEndpointRouteBuilder MapAnalyticsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/stats").WithTags("Stats");

        group.MapGet("/general", GeneralStatistics)
            .WithName("GeneralStatistics")
            .Produces<GeneralDto>()
            .ProducesProblem(StatusCodes.Status400BadRequest);

        group.MapGet("/trees", ProgressStatistics)
            .WithName("ProgressStatistics")
            .Produces<List<TaskNodeDto>>()
            .ProducesProblem(StatusCodes.Status400BadRequest);

        return app;
    }

    private static async Task<IResult> GeneralStatistics(DateTime? from, DateTime? to,
        GeneralStatsHandler handler, CancellationToken cancellationToken)
    {
        var cmd = new GetGeneralStatsCommand(from, to);

        var result = await handler.Handle(cmd, cancellationToken);

        return Results.Ok(result);
    }

    private static async Task<IResult> ProgressStatistics(DateTime? from, DateTime? to,
        ProgressStatisticsHandler handler, CancellationToken cancellationToken)
    {
        var cmd = new GetProgressStatisticsCommand(from, to);

        var result = await handler.Handle(cmd, cancellationToken);

        return Results.Ok(result);
    }
}
