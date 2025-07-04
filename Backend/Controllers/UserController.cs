<<<<<<< HEAD
// ﻿using Microsoft.AspNetCore.Authorization;
// using Microsoft.AspNetCore.Mvc;
// using ProjectManagementSystem1.Model.Dto;
// using ProjectManagementSystem1.Model.Dto.UserManagementDto;
// using ProjectManagementSystem1.Services;

// namespace ProjectManagementSystem1.Controllers
// {
//     [Route("api/[controller]")]
//     [ApiController]
//     public class UserController : ControllerBase
//     {
//         private readonly IUserService _userService;

//         public UserController(IUserService userService)
//         {
//             _userService = userService;
//         }

//         [HttpPost("change-password")]
//         [Authorize]
//         public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
//         {
//             var result = await _userService.ChangePasswordAsync(dto);
//             if (!result)
//                 return BadRequest(new { message = "Password change failed." });

//             return Ok(new { message = "Password changed successfully." });
//         }
//     }
// }
=======
﻿//using Microsoft.AspNetCore.Authorization;
//using Microsoft.AspNetCore.Mvc;
//using ProjectManagementSystem1.Model.Dto;
//using ProjectManagementSystem1.Model.Dto.UserManagementDto;
//using ProjectManagementSystem1.Services;

//namespace ProjectManagementSystem1.Controllers
//{
//    [Route("api/[controller]")]
//    [ApiController]
//    public class UserController : ControllerBase
//    {
//        private readonly IUserService _userService;

//        public UserController(IUserService userService)
//        {
//            _userService = userService;
//        }

//        [HttpPost("change-password")]
//        [Authorize]
//        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
//        {
//            var result = await _userService.ChangePasswordAsync(dto);
//            if (!result)
//                return BadRequest(new { message = "Password change failed." });

//            return Ok(new { message = "Password changed successfully." });
//        }
//    }
//}
>>>>>>> 890391528c11f4793f7d61f942815184bf328287
