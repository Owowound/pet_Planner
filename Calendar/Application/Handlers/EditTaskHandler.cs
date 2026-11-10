using Calendar.Application.Exceptions;
using Calendar.Application.Handlers.Commands;
using Calendar.Infrastructure.DB;

namespace Calendar.Application.Handlers;

public class EditTaskHandler
{
    private  readonly PlannerRepository _plannerRepository;

    public EditTaskHandler(PlannerRepository plannerRepository)
    {
        _plannerRepository = plannerRepository;
    }

    public async Task<Guid?> Handle(EditTaskCommand cmd, CancellationToken cancellationToken)
    {
        var task = await _plannerRepository.GetByIdAsync(cmd.TaskId, cancellationToken)
                   ?? throw new NotFoundException($"Задача {cmd.TaskId} не найдена");
        
        task.EditTask(cmd.NewName, cmd.NewDescription, cmd.NewDeadline, cmd.NewGoal, cmd.NewColor);
        
        var allTags = await _plannerRepository.GetAllTagsAsync(cancellationToken);
        var tags = allTags.Where(x => cmd.Tags.Contains(x.TagId)).ToList();
        task.SetTags(tags);
        
        await _plannerRepository.SaveChangesAsync(cancellationToken);
        return task.Id;
    }
}