using System;
using System.Threading;
using System.Threading.Tasks;
using Calendar.Application.Handlers.Commands;
using Calendar.Infrastructure.DB;

namespace Calendar.Application.Handlers.Tags;

public class CreateTagHandler
{
    private  readonly PlannerRepository _plannerRepository;
    private TagFabric _tagFabric;

    public CreateTagHandler(TagFabric tagFabric,  PlannerRepository plannerRepository)
    {
        _tagFabric = tagFabric;
        _plannerRepository = plannerRepository;
    }

    public async Task<Guid> Handle(CreateTagCommand cmd, CancellationToken cancellationToken)
    {
        var tag = _tagFabric.CreateNewTag(cmd.name, cmd.color);
        
        _plannerRepository.AddTag(tag);
        
        await _plannerRepository.SaveChangesAsync(cancellationToken);
        return tag.TagId;
    }
}