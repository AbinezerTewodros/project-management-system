using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectMessagesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProjectMessagesController(AppDbContext context)
        {
            _context = context;
        }

        // ✅ Get a message by ID
        [HttpGet("{id}")]
        public async Task<ActionResult<ProjectMessage>> Get(long id)
        {
            var message = await _context.ProjectMessages
                .Include(m => m.Attachment)
                .Include(m => m.Views)
                .FirstOrDefaultAsync(m => m.MessageId == id);

            if (message == null)
                return NotFound();

            return Ok(message);
        }

        // ✅ Get all messages for a given project
        [HttpGet("project/{projectId}")]
        public async Task<ActionResult<IEnumerable<ProjectMessage>>> GetByProject(long projectId)
        {
            var messages = await _context.ProjectMessages
                .Where(m => m.ProjectId == projectId && !m.IsDeleted)
                .OrderByDescending(m => m.TimeSent)
                .ToListAsync();

            return Ok(messages);
        }

        // ✅ Post a new message
        [HttpPost]
        public async Task<ActionResult<ProjectMessage>> Post(ProjectMessage message)
        {
            message.TimeSent = DateTime.UtcNow;
            _context.ProjectMessages.Add(message);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(Get), new { id = message.MessageId }, message);
        }

        // ✅ Edit a message (optional)
        [HttpPut("{id}")]
        public async Task<IActionResult> Edit(long id, ProjectMessage updated)
        {
            var message = await _context.ProjectMessages.FindAsync(id);
            if (message == null)
                return NotFound();

            message.Content = updated.Content;
            message.TimeEdited = DateTime.UtcNow;
            message.Version += 1;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // ✅ Soft-delete a message
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(long id)
        {
            var message = await _context.ProjectMessages.FindAsync(id);
            if (message == null)
                return NotFound();

            message.IsDeleted = true;
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
