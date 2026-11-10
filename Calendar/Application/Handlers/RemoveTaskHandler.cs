using System.Reflection.Metadata;
using System.Threading;
using System.Threading.Tasks;
using Calendar.Application.Exceptions;
using Calendar.Application.Handlers.Commands;
using Calendar.Domain;
using Calendar.Infrastructure.DB;

namespace Calendar.Application.Handlers;

public class RemoveTaskHandler
{
    private readonly PlannerRepository _plannerRepository;

    public RemoveTaskHandler(PlannerRepository plannerRepository)
    {
        _plannerRepository = plannerRepository;
    }

    public async Task Handle(RemoveTaskCommand cmd, CancellationToken cancellationToken)
    {
        var task = await _plannerRepository.GetByIdAsync(cmd.TaskId, cancellationToken)
                ?? throw new NotFoundException($"Задача {cmd.TaskId} не найдена");
        
        RemoveChildren(task);
        
        _plannerRepository.Remove(task);

        await _plannerRepository.SaveChangesAsync(cancellationToken);
        return;
    }

    private void RemoveChildren(TaskItem Parent)
    {
        foreach (var child in Parent.subTasks)
        {
            RemoveChildren(child);
        }
    }
}