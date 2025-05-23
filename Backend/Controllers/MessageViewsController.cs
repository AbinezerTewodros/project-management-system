namespace ProjectManagementSystem1.Controllers
{
[ApiController]
[Route("api/[controller]")]
public class MessageViewsController : ControllerBase
{
    private readonly MessagingDbContext _context;
    private readonly IMapper _mapper;

    public MessageViewsController(MessagingDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    [HttpPost]
    public async Task<IActionResult> RecordView([FromBody] MessageViewDto dto)
    {
        var view = _mapper.Map<MessageView>(dto);
        view.SeenTimestamp = DateTime.UtcNow;

        _context.MessageViews.Add(view);
        await _context.SaveChangesAsync();

        return Ok(_mapper.Map<MessageViewDto>(view));
    }

    [HttpGet("message/{messageId}")]
    public async Task<ActionResult<IEnumerable<MessageViewDto>>> GetByMessage(long messageId)
    {
        var views = await _context.MessageViews
            .Where(v => v.MessageId == messageId && !v.IsDeleted)
            .OrderBy(v => v.SeenTimestamp)
            .ToListAsync();

        return Ok(_mapper.Map<List<MessageViewDto>>(views));
    }

    [HttpDelete("{viewId}")]
    public async Task<IActionResult> Delete(long viewId)
    {
        var view = await _context.MessageViews.FindAsync(viewId);
        if (view == null)
            return NotFound();

        view.IsDeleted = true;
        await _context.SaveChangesAsync();
        return NoContent();
    }
}

}
