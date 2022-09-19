import { Body, Controller, Delete, Get, Logger, Param, Patch, Query, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { User } from '@prisma/client'
import { UpdatePasswordDto, UpdateUserDto } from './dto/update-user.dto'
import { GetUser } from '../decorators/get-user.decorator'
import { UserService } from './user.service'

@UseGuards(AuthGuard())
@Controller('user')
export class UsersController {
    constructor(private usersService: UserService) {}

    private logger = new Logger('UserController')

    @Patch()
    updateUser(@GetUser() user: User, @Body() updateUserDto: UpdateUserDto) {
        this.logger.verbose(`${user.username} wants to change ${Object.keys(updateUserDto).join(', ')}`)
        return this.usersService.updateUser(user, updateUserDto)
    }

    @Patch('/password')
    updatePassword(@GetUser() user: User, @Body() updatePasswordDto: UpdatePasswordDto) {
        this.logger.verbose(`${user.username} wants to change the password`)
        return this.usersService.updatePassword(user, updatePasswordDto)
    }

    @Delete()
    deleteUser(@GetUser() user: User, @Body() { password }: { password: string }) {
        this.logger.verbose(`deleting user '${user.username}'`)
        return this.usersService.deleteUser(user, password)
    }

    @Get('/search')
    searchUsers(@GetUser() user: User, @Query('q') queryString: string) {
        this.logger.verbose(`'${user.username}' searches uses for ${queryString}`)
        return this.usersService.searchUsers(user.id, queryString)
    }

    @Get('/:id')
    getUser(@GetUser() requestingUser: User, @Param('id') id: string) {
        this.logger.verbose(`'${requestingUser.username}' gets information about ${id}`)
        return this.usersService.getUser(requestingUser.id, id)
    }
}
