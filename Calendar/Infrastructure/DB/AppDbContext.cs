using System.Collections.Generic;
using Calendar.Domain;
using Calendar.Infrastructure.Outbox;
using Microsoft.EntityFrameworkCore;

namespace Calendar.Infrastructure.DB;

public class AppDbContext : DbContext
{
    public DbSet<TaskItem> TaskItems { get; set; }
    public DbSet<Tag> Tags { get; set; }
    public DbSet<Reminder>  Reminders { get; set; }
    public DbSet<OutboxMessage> OutboxMessages { get; set; }

    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TaskItem>()
            .HasOne(x => x.Parent)
            .WithMany(x => x.subTasks)
            .HasForeignKey(x => x.ParentId)
            .OnDelete(DeleteBehavior.Cascade);
        
        modelBuilder.Entity<Tag>(b =>
        {
            b.Property(x => x.TagName).HasMaxLength(50).IsRequired();
            b.HasIndex(x => x.TagName).IsUnique();
        });

        modelBuilder.Entity<TaskItem>()
            .HasMany(x => x.Tags)
            .WithMany()
            .UsingEntity<Dictionary<string, object>>(
                "TaskTags",
                r => r.HasOne<Tag>().WithMany().HasForeignKey("TagId"),
                l => l.HasOne<TaskItem>().WithMany().HasForeignKey("TaskId"));
        
        modelBuilder.Entity<OutboxMessage>(b =>
        {
            b.Property(x => x.Type).HasMaxLength(100);
            b.Property(x => x.Payload).HasColumnType("jsonb");
            b.HasIndex(x => x.ProcessedAt);
        });
    }
}