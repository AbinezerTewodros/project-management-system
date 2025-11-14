using Microsoft.AspNetCore.Mvc;
using ProjectManagementSystem1.Services.ErpUserService;

namespace ProjectManagementSystem1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ErpUserController : ControllerBase
    {
        private readonly IErpUserService _erpService;

        public ErpUserController(IErpUserService erpService)
        {
            _erpService = erpService;
        }

        [HttpPost("sync-single")]
        public async Task<IActionResult> SyncSingle([FromQuery] string employeeId)
        {
            try
            {
                var result = await _erpService.SyncSingleUserAsync(employeeId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("sync-multiple")]
        public async Task<IActionResult> SyncMultiple([FromBody] List<string> employeeIds)
        {
            var result = await _erpService.SyncMultipleUsersAsync(employeeIds);
            return Ok(result);
        }

        [HttpPost("sync-all")]
        public async Task<IActionResult> SyncAll()
        {
            try
            {
                var result = await _erpService.SyncAllUsersAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

    }

}