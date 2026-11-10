using System.Threading;
using System.Threading.Tasks;
using Calendar.Application.Exceptions;
using Calendar.Application.Handlers.Commands;
using Calendar.Infrastructure.DB;

namespace Calendar.Application.Handlers;

public class AddSubTaskHandler
{
    PlannerRepository _plannerRepository;
    public AddSubTaskHandler(PlannerRepository plannerRepository)
    {
        _plannerRepository = plannerRepository;
    }
    
    public async Task Handle(AddSubTaskCommand cmd,  CancellationToken cancellationToken)
    {
        var parentTask = await _plannerRepository.GetByIdAsync(cmd.ParentId, cancellationToken)
                         ?? throw new NotFoundException($"Задача {cmd.ParentId} не найдена");
        var childTask = await _plannerRepository.GetByIdAsync(cmd.ChildId,  cancellationToken)
                        ?? throw new NotFoundException($"Задача {cmd.ChildId} не найдена");
        
        parentTask.AddSubTask(childTask);
        
        await _plannerRepository.SaveChangesAsync(cancellationToken);
    } 
}