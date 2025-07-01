import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class ParamIdDto {
  @IsNotEmpty({ message: "L'ID est requis" })
  @IsString({ message: "L'ID doit être une chaîne de caractères" })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: "L'ID doit être un identifiant valide",
  })
  id: string;
}
