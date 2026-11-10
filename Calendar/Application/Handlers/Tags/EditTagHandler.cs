using System;
using System.Threading;
using System.Threading.Tasks;
using Calendar.Application.Handlers.Commands;
using Calendar.Infrastructure.DB;

namespace Calendar.Application.Handlers.Tags;

public class EditTagHandler
{
    private  readonly PlannerRepository _plannerRepository;

    public EditTagHandler(PlannerRepository plannerRepository)
    {
        _plannerRepository = plannerRepository;
    }

    public async Task<Guid> Handle(EditTagCommand cmd, CancellationToken cancellationToken)
    {
        var tag = await _plannerRepository.GetTagByIdAsync(cmd.TagId, cancellationToken);
        
        tag.EditTag(cmd.name, cmd.color);
        
        await _plannerRepository.SaveChangesAsync(cancellationToken);
        return tag.TagId;
    }
}