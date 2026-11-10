using System.Threading;
using System.Threading.Tasks;
using Calendar.Application.Exceptions;
using Calendar.Application.Handlers.Commands;
using Calendar.Domain;
using Calendar.Infrastructure.DB;

namespace Calendar.Application.Handlers;

public class AddProgressHandler
{
    PlannerRepository _plannerRepository;
    public AddProgressHandler(PlannerRepository plannerRepository)
    {
        _plannerRepository = plannerRepository;
    }

    public async Task Handle(AddProgressCommand cmd,  CancellationToken cancellationToken) 
    {
        TaskItem task = await _plannerRepository.GetByIdAsync(cmd.Id, cancellationToken)
                        ?? throw new NotFoundException($"Задача {cmd.Id} не найдена");
        
        bool isCompleted = task.AddProgress(cmd.AdditionalProgress);
        
        await _plannerRepository.SaveChangesAsync(cancellationToken);
    } 
}