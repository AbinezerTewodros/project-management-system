namespace ProjectManagementSystem1.Controllers
{
[ApiController]
[Route("api/[controller]")]
public class DepartmentalMessagesController : ControllerBase
{
    private readonly MessagingDbContext _context;
    private readonly IMapper _mapper;

    public DepartmentalMessagesController(MessagingDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DepartmentalMessageDto>> Get(long id)
    {
        var message = await _context.DepartmentalMessages
            .Include(m => m.Attachment)
            .FirstOrDefaultAsync(m => m.MessageId == id);

        if (message == null)
            return NotFound();

        return Ok(_mapper.Map<DepartmentalMessageDto>(message));
    }

    [HttpGet("department/{deptId}")]
    public async Task<ActionResult<IEnumerable<DepartmentalMessageDto>>> GetByDepartment(int deptId)
    {
        var messages = await _context.DepartmentalMessages
            .Where(m => m.ReceiverDepartmentId == deptId && !m.IsDeleted)
            .OrderByDescending(m => m.TimeSent)
            .Include(m => m.Attachment)
            .ToListAsync();

        return Ok(_mapper.Map<List<DepartmentalMessageDto>>(messages));
    }

    [HttpPost]
    public async Task<ActionResult<DepartmentalMessageDto>> Post([FromBody] DepartmentalMessageDto dto)
    {
        var message = _mapper.Map<DepartmentalMessage>(dto);
        message.TimeSent = DateTime.UtcNow;

        _context.DepartmentalMessages.Add(message);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = message.MessageId }, _mapper.Map<DepartmentalMessageDto>(message));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Edit(long id, [FromBody] DepartmentalMessageDto dto)
    {
        var existing = await _context.DepartmentalMessages.FindAsync(id);
        if (existing == null)
            return NotFound();

        existing.Content = dto.Content;
        existing.TimeEdited = DateTime.UtcNow;
        existing.Version += 1;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(long id)
    {
        var message = await _context.DepartmentalMessages.FindAsync(id);
        if (message == null)
            return NotFound();

        message.IsDeleted = true;
        await _context.SaveChangesAsync();
        return NoContent();
    }
}

}
