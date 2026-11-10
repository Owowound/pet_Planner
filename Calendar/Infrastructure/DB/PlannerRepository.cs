using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Calendar.Domain;
using Calendar.Infrastructure.Outbox;
using Contracts;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace Calendar.Infrastructure.DB;

public class PlannerRepository
{
    AppDbContext _context;
    
    public PlannerRepository(AppDbContext context)
    {
        _context = context;
    }

    public void AddTask(TaskItem task)
    {
        _context.TaskItems.Add(task);
    }
    
    public void Remove(TaskItem task)
    {
        _context.TaskItems.Remove(task);
    }
    
    public async Task<TaskItem?> GetByIdAsync(Guid id,  CancellationToken cancellationToken)
    {
        TaskItem root = await _context.TaskItems.
            Include(x => x.Tags).
            FirstOrDefaultAsync(x => x.Id == id,  cancellationToken);

        if (root == null)
        {
            return null;
        }

        var CurrentLevelIds = new List<Guid?> { root.Id };

        while (CurrentLevelIds.Count > 0)
        {
            var children = await _context.TaskItems.
                Include(x => x.Tags).
                Where(x => CurrentLevelIds.Contains(x.ParentId)).
                ToListAsync(cancellationToken);
            
            CurrentLevelIds = children.Select(x => (Guid?)x.Id).ToList();
        }
        
        return root;
    }

    public async Task<List<TaskItem>> GetByPeriodAsync(DateTime dateStart, DateTime dateEnd, CancellationToken cancellationToken)
    {
        var dayStart = DateTime.SpecifyKind(dateStart.Date, DateTimeKind.Utc);
        var dayEnd = DateTime.SpecifyKind(dateEnd.Date, DateTimeKind.Utc).AddDays(1);

        return await _context.TaskItems
            .Include(x => x.subTasks)
            .Include(x => x.Tags)
            .Where(x => x.Deadline >= dayStart && x.Deadline < dayEnd)
            .ToListAsync(cancellationToken);
    }
    
    public void AddTag(Tag tag) => _context.Tags.Add(tag);

    public void RemoveTag(Tag tag) => _context.Tags.Remove(tag);

    public Task<Tag?> GetTagByIdAsync(Guid id, CancellationToken ct)
    {
        return _context.Tags.FirstOrDefaultAsync(t => t.TagId == id, ct);
    }

    public Task<List<Tag>> GetAllTagsAsync(CancellationToken ct)
    {
        return _context.Tags.OrderBy(t => t.TagName).ToListAsync(ct);
    }

    public Task<bool> TagNameExistsAsync(string normalizedName, Guid? exceptId, CancellationToken ct)
    {
        return _context.Tags.AnyAsync(t => t.TagName == normalizedName && t.TagId != exceptId, ct);
    }



    public async Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        var messages = new List<OutboxMessage>();
        var deletedTaskIds = new List<Guid>();

        foreach (var entry in _context.ChangeTracker.Entries<TaskItem>())
        {
            if (entry.State is EntityState.Added or EntityState.Modified)
            {
                messages.Add(OutboxMessage.Create(SnapshotMapper.ToSnapshot(entry.Entity)));
            }
            else if (entry.State == EntityState.Deleted)
            {
                deletedTaskIds.Add(entry.Entity.Id);
            }
        }

        if (deletedTaskIds.Count > 0)
        {
            messages.Add(OutboxMessage.Create(new TaskDeleted(deletedTaskIds, DateTime.UtcNow)));
        }

        _context.OutboxMessages.AddRange(messages);
        return await _context.SaveChangesAsync(ct);
    }
}