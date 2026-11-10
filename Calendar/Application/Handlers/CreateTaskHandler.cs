using System;
using System.Threading;
using System.Threading.Tasks;
using Calendar.Application.Handlers.Commands;
using Calendar.Infrastructure.DB;

namespace Calendar.Application.Handlers;

public class CreateTaskHandler
{
    private  readonly PlannerRepository _plannerRepository;
    private ItemFabric _itemFabric;

    public CreateTaskHandler(ItemFabric itemFabric,  PlannerRepository plannerRepository)
    {
        _itemFabric = itemFabric;
        _plannerRepository = plannerRepository;
    }

    public async Task<Guid> Handle(CreateTaskCommand cmd, CancellationToken cancellationToken)
    {
        var Task = _itemFabric.CreateNewTask(cmd.Name, cmd.Description, cmd.Deadline, cmd.Goal, cmd.color);
        
        var allTags = await _plannerRepository.GetAllTagsAsync(cancellationToken);
        var tags = allTags.Where(x => cmd.Tags.Contains(x.TagId)).ToList();
        Task.SetTags(tags);

        _plannerRepository.AddTask(Task);
        
        await _plannerRepository.SaveChangesAsync(cancellationToken);
        return Task.Id;
    }
}