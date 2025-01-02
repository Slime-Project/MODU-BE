import { OmitType } from '@nestjs/mapped-types';

import { ReviewWithReviewerDto } from '@/review/dto/review-with-reviewer.dto';

export class ReviewDto extends OmitType(ReviewWithReviewerDto, ['imgs']) {}
