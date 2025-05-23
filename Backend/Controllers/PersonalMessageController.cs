namespace ProjectManagementSystem1.Controllers
{
[ApiController]
[Route("api/[controller]")]
public class PersonalMessagesController : ControllerBase
{
    private readonly MessagingDbContext _context;
    private readonly IMapper _mapper;

    public PersonalMessagesController(MessagingDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PersonalMessageDto>> Get(long id)
    {
        var message = await _context.PersonalMessages
            .Include(m => m.Attachment)
            .FirstOrDefaultAsync(m => m.MessageId == id);

        if (message == null)
            return NotFound();

        return _mapper.Map<PersonalMessageDto>(message);
    }

    [HttpPost]
    public async Task<ActionResult<PersonalMessageDto>> Post(PersonalMessageDto dto)
    {
        var message = _mapper.Map<PersonalMessage>(dto);
        message.TimeSent = DateTime.UtcNow;

        _context.PersonalMessages.Add(message);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = message.MessageId }, _mapper.Map<PersonalMessageDto>(message));
    }
}

}
