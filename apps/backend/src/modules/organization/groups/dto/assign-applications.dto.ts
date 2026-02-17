import { IsArray, IsUUID } from 'class-validator';

export class AssignApplicationsDto {
  @IsArray()
  @IsUUID(4, { each: true })
  applicationIds: string[];
}
