
using System.ComponentModel.DataAnnotations;

namespace BjjEire.Application.Common;

public class BaseApiEntityModel
{
    [Key] public required string Id { get; set; }

    public DateTime CreatedOnUtc { get; set; }
    
    public DateTime? UpdatedOnUtc { get; set; }
}