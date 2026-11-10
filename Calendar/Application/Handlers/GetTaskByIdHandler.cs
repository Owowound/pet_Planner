using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Calendar.Application.Dto;
using Calendar.Application.Exceptions;
using Calendar.Application.Handlers.Commands;
using Calendar.Domain;
using Calendar.Infrastructure.DB;

namespace Calendar.Application.Handlers;

public class GetTaskByIdHandler
{
    private readonly PlannerRepository _plannerRepository;

    public GetTaskByIdHandler(PlannerRepository plannerRepository)
    {
        _plannerRepository = plannerRepository;
    }

    public async Task<TaskDetailsDto> Handle(GetTaskByIdCommand cmd, CancellationToken cancellationToken)
    {
        var t = await _plannerRepository.GetByIdAsync(cmd.Id, cancellationToken)
                ?? throw new NotFoundException($"Задача {cmd.Id} не найдена");

        return new TaskDetailsDto(t.Id, t.Name, t.Description, t.Deadline, t.Goal, t.Progress,
            t.ProgressPercent, t.ChildProgressPercent, t.IsCompleted, t.ParentId,
            t.subTasks.Select(ToSubTaskDto).ToList(), t.Tags.Select(x => new TagDto(x.TagId, x.TagName, x.Color)).ToList(), t.Color);
    }
    
    private static SubTaskDto ToSubTaskDto(TaskItem t) => new(
        t.Id, t.Name, t.Deadline, t.ProgressPercent, t.IsCompleted,
        t.subTasks.Select(ToSubTaskDto).ToList(), t.Color);
}