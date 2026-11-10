using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Calendar.Application.Dto;
using Calendar.Application.Handlers.Commands;
using Calendar.Domain;
using Calendar.Infrastructure.DB;

namespace Calendar.Application.Handlers;

public class GetTasksByDateHandler
{
    private readonly PlannerRepository _plannerRepository;

    public GetTasksByDateHandler(PlannerRepository plannerRepository)
    {
        _plannerRepository = plannerRepository;
    }

    public async Task<List<TaskShortDto>> Handle(GetTasksByPeriodCommand cmd, CancellationToken cancellationToken)
    {
        var tasks = await _plannerRepository.GetByPeriodAsync(cmd.DateStart, cmd.DateEnd, cancellationToken);

        return tasks
            .Select(t => new TaskShortDto(t.Id, t.Name, t.Deadline, t.Goal,
                t.Progress, t.ProgressPercent, t.IsCompleted,
                t.ParentId,
                t.subTasks.Select(c => c.Id).ToList(),
                t.Tags.Select(x => new TagDto(x.TagId, x.TagName, x.Color)).ToList(), t.Color))
            .ToList();
    }
}