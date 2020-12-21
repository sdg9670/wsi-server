import MongoDB from '@/database/mongo.db';
import TokenValidator from '@/middlewares/token.validator';
import express, { NextFunction, Request, Response } from 'express';

class PlaceController {
  router = express.Router();

  /*
    공통 경로에 값
    req.params : 경로 파라미터

    post, put: body
    req.body : 바디 (타입 O)

    get, delete: body X
    req.query : 파라미터 (무조건 문자열)
  */
  constructor() {
    // 로그인 인증
    this.router.use(TokenValidator.middleware);

    this.router.post('/', this.addPlace);
    this.router.get('/', this.getPlaces);
    this.router.get('/one', this.getPlaceOne);
    this.router.put('/one/:id', this.setPlaceOneById);
    this.router.delete('/one/:id', this.removePlaceOneById);
  }

  // 장소 등록
  private async addPlace(req: Request, res: Response, next: NextFunction) {
    const address = req.body.address;
    const coord = req.body.coord;
    const name = req.body.name;
    const detailAddress = req.body.detailAddress;
    const description = req.body.description;
    const pictures = req.body.pictures;
    const score = req.body.score;

    const email = (req.headers.user as any).email;
    console.log(pictures);
    const result = await MongoDB.place.findById(
      `${coord.x.toFixed(16)}-${coord.y.toFixed(16)}-${email}`
    );

    // 장소가 없으면 insert, 있으면 배열에 update
    if (result === null) {
      const insertResult = await MongoDB.place.insertMany([
        {
          _id: `${coord.x.toFixed(16)}-${coord.y.toFixed(16)}-${email}`,
          email,
          address,
          coord,
          places: [
            {
              name,
              detailAddress,
              description,
              pictures,
              score,
              createTime: new Date(),
            },
          ],
        },
      ]);
      console.log(insertResult);
    } else {
      const insertResult = await MongoDB.place.updateOne(
        { _id: `${coord.x.toFixed(16)}-${coord.y.toFixed(16)}-${email}` },
        {
          $push: {
            places: {
              name,
              detailAddress,
              description,
              pictures,
              score,
              createTime: new Date(),
            },
          },
        }
      );
      console.log(insertResult);
    }

    res.status(200).json({
      isLogin: true,
    });
  }

  // 전체 장소 목록 불러오기
  private async getPlaces(req: Request, res: Response, next: NextFunction) {
    const email = (req.headers.user as any).email;

    const result = await MongoDB.place.find({ email });

    res.status(200).json(result);
  }

  // 특정 장소 불러오기
  private async getPlaceOne(req: Request, res: Response, next: NextFunction) {
    const x = parseFloat(req.query.x as string);
    const y = parseFloat(req.query.y as string);
    const email = (req.headers.user as any).email;

    const result = await MongoDB.place.findById(
      `${x.toFixed(16)}-${y.toFixed(16)}-${email}`
    );
    console.log(x, y, result);
    res.status(200).json(result ? result.toJSON().places : []);
  }

  // 특정 장소 삭제
  private async removePlaceOneById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const x = parseFloat(req.query.x as string);
    const y = parseFloat(req.query.y as string);
    const id = req.params.id as any;
    const email = (req.headers.user as any).email;

    console.log(x, y, email, id);
    const result = await MongoDB.place.findOneAndUpdate(
      { _id: `${x.toFixed(16)}-${y.toFixed(16)}-${email}` },
      {
        $pull: { places: { _id: id } },
      },
      { new: true }
    );

    // 삭제한 좌표에 장소가 없으면 좌표도 삭제
    if (result.toJSON().places.length === 0) {
      await MongoDB.place.findOneAndDelete({
        _id: `${x.toFixed(16)}-${y.toFixed(16)}-${email}`,
      });
    }

    res.status(200).json();
  }

  // 특정 장소 수정
  private async setPlaceOneById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const coord = req.body.coord;
    const name = req.body.name;
    const detailAddress = req.body.detailAddress;
    const description = req.body.description;
    const pictures = req.body.pictures;
    const score = req.body.score;
    const id = req.params.id;

    const email = (req.headers.user as any).email;

    await MongoDB.place.updateOne(
      {
        _id: `${coord.x.toFixed(16)}-${coord.y.toFixed(16)}-${email}`,
        'places._id': id,
      },
      {
        $set: {
          'places.$': {
            name,
            detailAddress,
            description,
            pictures,
            score,
            createTime: new Date(),
          },
        },
      }
    );
    res.status(200).json();
  }
}

export default PlaceController;
