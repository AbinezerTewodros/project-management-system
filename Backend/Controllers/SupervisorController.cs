// ﻿using Microsoft.AspNetCore.Authorization;
// using Microsoft.AspNetCore.Mvc;

// namespace ProjectManagementSystem1.Controllers
// {
//     [Route("api/[controller]")]
//     [ApiController]
//     public class SupervisorController : ControllerBase
//     {
//         [HttpGet("reports")]
//         [Authorize(Policy = "SupervisorOnly")]
//         public IActionResult GetReports()
//         {
//             return Ok("📊 Supervisor-only report data.");
//         }
//     }

// }
