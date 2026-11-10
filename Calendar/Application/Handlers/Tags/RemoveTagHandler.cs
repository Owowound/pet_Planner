using System;
using System.Threading;
using System.Threading.Tasks;
using Calendar.Application.Handlers.Commands;
using Calendar.Infrastructure.DB;

namespace Calendar.Application.Handlers.Tags;

public class RemoveTagHandler
{
    private  readonly PlannerRepository _plannerRepository;

    public RemoveTagHandler(PlannerRepository plannerRepository)
    {
        _plannerRepository = plannerRepository;
    }

    public async Task Handle(RemoveTagCommand cmd, CancellationToken cancellationToken)
    {
        var tag = await _plannerRepository.GetTagByIdAsync(cmd.TagId, cancellationToken);
        _plannerRepository.RemoveTag(tag);
        
        await _plannerRepository.SaveChangesAsync(cancellationToken);
        return;
    }
}