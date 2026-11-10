using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Calendar.Application.Dto;
using Calendar.Application.Handlers;
using Calendar.Application.Handlers.Commands;
using Calendar.Application.Handlers.Tags;
using Calendar.Infrastructure.DB;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc.Diagnostics;
using Microsoft.AspNetCore.Routing;

namespace Calendar.Api.Endpoints;

public static class TaskEndpoints
{
    public static IEndpointRouteBuilder MapTaskEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/tasks").WithTags("Tasks");

        group.MapPost("/", CreateTask)
            .WithName("CreateTask")
            .Produces<Guid>(StatusCodes.Status201Created)
            .ProducesValidationProblem();
        
        group.MapDelete("/{id:guid}", RemoveTask)
            .WithName("RemoveTask")
            .Produces<Guid>(StatusCodes.Status201Created)
            .ProducesValidationProblem();
        
        group.MapPut("/{id:guid}", EditTask)
            .WithName("EditTask")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapPost("/{id:guid}/subtasks", AddSubTask)
            .WithName("AddSubtask")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapPost("/{id:guid}/progress", AddProgress)
            .WithName("AddProgress")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound);
        
        group.MapGet("/", GetTasksByPeriod)
            .WithName("GetTasksByDate")
            .Produces<List<TaskShortDto>>();

        group.MapGet("/{id:guid}", GetTaskById)
            .WithName("GetTaskById")
            .Produces<TaskDetailsDto>()
            .ProducesProblem(StatusCodes.Status404NotFound);
        
        var tags = app.MapGroup("/api/tags").WithTags("Tags");

        tags.MapGet("/", GetTags)
            .WithName("GetTags")
            .Produces<List<TagDto>>();

        tags.MapPost("/", CreateTag)
            .WithName("CreateTag")
            .Produces(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status409Conflict);

        tags.MapPut("/{id:guid}", EditTag)
            .WithName("EditTag")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict);

        tags.MapDelete("/{id:guid}", RemoveTag)
            .WithName("RemoveTag")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound);
        
        return app;
    }
    
    private static async Task<IResult> CreateTag(CreateTagRequest request, CreateTagHandler handler, CancellationToken cancellationToken)
    {
        var cmd = new CreateTagCommand(request.Name, request.color);
        
        var id = await handler.Handle(cmd, cancellationToken);
        
        return Results.Created($"/api/tasks/{id}", new { id });
    }
    
    private static async Task<IResult> RemoveTag(Guid id, RemoveTagHandler handler, CancellationToken cancellationToken)
    {
        var cmd = new RemoveTagCommand(id);

        await handler.Handle(cmd, cancellationToken);
        
        return Results.NoContent();
    }
    
    private static async Task<IResult> EditTag(Guid id, EditTagRequest request, EditTagHandler handler, CancellationToken cancellationToken)
    {
        var cmd = new EditTagCommand(id, request.Name, request.color);

        await handler.Handle(cmd, cancellationToken);
        
        return Results.NoContent();
    }
    
    private static async Task<IResult> GetTags(PlannerRepository repository, CancellationToken ct)
    {
        var tags = await repository.GetAllTagsAsync(ct);
        return Results.Ok(tags.Select(t => new TagDto(t.TagId, t.TagName, t.Color)));
    }

    private static async Task<IResult> CreateTask(CreateTaskRequest request, CreateTaskHandler handler, CancellationToken cancellationToken)
    {
        var cmd = new CreateTaskCommand(request.Name, request.Description, request.Deadline, request.Goal, request.Tags, request.color);

        var id = await handler.Handle(cmd, cancellationToken);
        
        return Results.Created($"/api/tasks/{id}", new { id });
    }
    
    private static async Task<IResult> RemoveTask(Guid id, RemoveTaskHandler handler, CancellationToken cancellationToken)
    {
        var cmd = new RemoveTaskCommand(id);

        await handler.Handle(cmd, cancellationToken);
        
        return Results.NoContent();
    }
    
    private static async Task<IResult> EditTask(Guid id, EditTaskRequest request, EditTaskHandler handler, CancellationToken cancellationToken)
    {
        var cmd = new EditTaskCommand(id,  request.Name, request.Description, request.Deadline, request.Goal, request.Tags, request.color);

        await handler.Handle(cmd, cancellationToken);
        
        return Results.NoContent();
    }

    private static async Task<IResult> AddProgress(Guid id, AddProgressRequest request,
        AddProgressHandler handler, CancellationToken cancellationToken)
    {
        var cmd = new AddProgressCommand(id, request.AdditionalProgress);

        await handler.Handle(cmd, cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> AddSubTask(Guid id, AddSubTaskRequest request,
        AddSubTaskHandler handler, CancellationToken cancellationToken)
    {
        var cmd = new AddSubTaskCommand(id, request.ChildId);

        await handler.Handle(cmd, cancellationToken);
        return Results.NoContent();
    }
    
    private static async Task<IResult> GetTasksByPeriod(DateTime dateStart, DateTime dateEnd, GetTasksByDateHandler handler,
        CancellationToken cancellationToken)
    {
        var tasks = await handler.Handle(new GetTasksByPeriodCommand(dateStart, dateEnd), cancellationToken);
        return Results.Ok(tasks);
    }

    private static async Task<IResult> GetTaskById(Guid id, GetTaskByIdHandler handler,
        CancellationToken cancellationToken)
    {
        return Results.Ok(await handler.Handle(new GetTaskByIdCommand(id), cancellationToken));
    }
}