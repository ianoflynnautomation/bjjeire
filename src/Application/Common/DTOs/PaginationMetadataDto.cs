
namespace BjjWorld.Application.Common.DTOs;

public class PaginationMetadataDto
{
    public int TotalItems { get; set; }
    public int CurrentPage { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; } 
    public bool HasNextPage { get; set; } 
    public bool HasPreviousPage { get; set; } 
    public string? NextPageUrl { get; set; } 
    public string? PreviousPageUrl { get; set; } 
}